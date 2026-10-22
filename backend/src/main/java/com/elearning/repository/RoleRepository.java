package com.elearning.repository;

import com.elearning.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository for {@link Role} entity.
 * Provides lookup by role name.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {

    /**
     * Finds a role by its unique role name (e.g. ROLE_LEARNER, ROLE_ADMIN).
     *
     * @param roleName name of the role
     * @return Optional containing found Role or empty if not found
     */
    Optional<Role> findByRoleName(String roleName);

    /**
     * Finds a role by its unique role name using a pessimistic write lock (SELECT ... FOR UPDATE).
     * Used to serialize concurrent administrative role modifications and prevent demoting the last active administrator.
     *
     * @param roleName name of the role (e.g. Admin, ROLE_ADMIN)
     * @return Optional containing locked Role or empty if not found
     */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT r FROM Role r WHERE LOWER(r.roleName) = LOWER(:roleName) OR LOWER(r.roleName) = LOWER(CONCAT('ROLE_', :roleName))")
    Optional<Role> findByRoleNameForUpdate(@org.springframework.data.repository.query.Param("roleName") String roleName);
}
